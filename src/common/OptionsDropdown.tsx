import {
  RepeatIcon,
  SettingsIcon,
  CalendarIcon,
  StarIcon,
} from '@chakra-ui/icons';
import {
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
} from '@chakra-ui/react';
import React from 'react';
import { useAppState } from '../state/store';

const OptionsDropdown = () => {
  const { openAIKey, updateSettings } = useAppState((state) => ({
    openAIKey: state.settings.openAIKey,
    updateSettings: state.settings.actions.update,
  }));

  if (!openAIKey) return null;

  return (
    <Menu>
      <MenuButton
        as={IconButton}
        aria-label="Options"
        icon={<SettingsIcon />}
        variant="outline"
      />
      <MenuList>
        <MenuItem
          icon={<RepeatIcon />}
          onClick={() => {
            updateSettings({ openAIKey: '' });
          }}
        >
          Reset API Key
        </MenuItem>
        <MenuItem
          icon={<CalendarIcon />}
          onClick={() => {
            updateSettings({ page: 'resume' });
          }}
        >
          Resume
        </MenuItem>
        <MenuItem
          icon={<StarIcon />}
          onClick={() => {
            updateSettings({ page: 'memory' });
          }}
        >
          Memory
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

export default OptionsDropdown;
